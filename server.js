import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // A host creates a room (they join using their own socket.id as the room code)
    socket.on("create-room", (callback) => {
        socket.join(socket.id);
        console.log(`[Host] Created room: ${socket.id}`);
        callback({ roomId: socket.id });
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
        const targetRoom = socket.roomId || socket.id;
        socket.to(targetRoom).emit("game-data", data);
    });

    socket.on("disconnect", () => {
        const targetRoom = socket.roomId || socket.id;
        socket.to(targetRoom).emit("peer-disconnected");
        console.log(`[Disconnect] Socket left: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
io.listen(PORT);
console.log(`Socket.IO Signal Server running on port ${PORT}`);
