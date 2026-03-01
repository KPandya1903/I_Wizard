import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // A host creates a room
    socket.on("create-room", (callback) => {
        // Generate a clean explicit 6-character room code instead of relying on the Host's raw socket.id.
        // Broadcasting to a socket's own auto-assigned ID can drop packets in CloudFront/EB environments
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        socket.join(roomId);
        socket.roomId = roomId; // Store proper reference
        console.log(`[Host] Created room: ${roomId}`);
        callback({ roomId });
    });

    // A guest joins an existing room
    socket.on("join-room", (roomId, callback) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room) {
            return callback({ error: "Room not found" });
        }

        socket.join(roomId);
        socket.roomId = roomId;
        console.log(`[Guest] Joined room: ${roomId}`);

        // Notify the host that a guest arrived
        socket.to(roomId).emit("guest-joined", socket.id);
        callback({ success: true });
    });

    // Relay generic game data to everyone else in the room
    socket.on("game-data", (data) => {
        if (socket.roomId) {
            // Because roomId is an explicit shared string and not the Host's raw socket.id, 
            // the broadcast correctly sends to everyone in the room except the sender
            socket.to(socket.roomId).emit("game-data", data);
        }
    });

    // Relay real-time microphone chunks
    socket.on("voice-data", (audioBlob) => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit("voice-data", audioBlob);
        }
    });

    socket.on("disconnect", () => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit("peer-disconnected");
        }
        console.log(`[Disconnect] Socket left: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
io.listen(PORT);
console.log(`Socket.IO Signal Server running on port ${PORT}`);
