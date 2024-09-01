// console.log("HALA AT YO BOY");

import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import { AllSlots, Slot } from "./slot"; // Import only the necessary items
import cors from "cors";

const app = express();

app.use(
	cors({
		origin: "*",
	})
);

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});
const baseURL = "http://localhost:3000";

type SlotResponse = {
	id: string;
	start: string;
	end: string;
};

export const fetchSlots = async (id: string): Promise<SlotResponse[]> => {
	try {
		console.log("Fetching slots");
		const slots = await axios.post(`${baseURL}/public/getGigsterTime`, {
			gigsterId: id,
		});
		const allSlots = AllSlots.getInstance();

		// Add the slots to the singleton instance
		slots.data.forEach((slot: any) => {
			const slotInstance = new Slot(slot.gigsterId);
			slotInstance.addSlot(slot);
			allSlots.addSlots(slotInstance);
		});

		// console.log("Slots fetched and added to the singleton instance");
		return slots.data;
	} catch (error) {
		console.error("Error fetching slots:", error);
		return [];
	}
};

io.on("connection", (socket: any) => {
	console.log(`Connection established with ${socket.id}`);

	socket.on("message", (msg: string) => {
		console.log(msg);
		socket.broadcast.emit("message", msg);
	});

	socket.on("joinRoom", async (room: any) => {
		console.log(`Joining room for gigster ${room.gigsterId}`);
		// Access the singleton instance
		const allSlots = AllSlots.getInstance().getSlots();

		if (allSlots.length != 0) {
			// fetchSlots();
		}

		let i = -1;
		for (let j = 0; j < allSlots.length; j++) {
			if (allSlots[j].getId() === room.gigsterId) {
				i = j;
				break;
			}
		}
		console.log(allSlots);

		try {
			if (i != -1) {
				const getSlots = allSlots[i].getSlots();

				if (getSlots.length === 0) {
					socket.emit("noSlotsAvailable", {
						status: 400,
						message: "No slots available for booking",
					});
					return;
				}
				// Join the room and emit the data
				socket.join(`${room.gigsterId}`);
				socket.emit("roomJoined", {
					slots: { slots: getSlots, status: 200, gigsterId: room.gigsterId },
				});
				console.log(`Joined room: ${room.gigsterId}`);
				return;
			}
			const getSlots = await fetchSlots(room.gigsterId);
			console.log(getSlots);

			if (getSlots.length === 0) {
				socket.emit("noSlotsAvailable", "No slots available for booking");
				return;
			}

			// Join the room and emit the data
			socket.join(`${room.gigsterId}`);
			socket.emit("roomJoined", {
				slots: getSlots,
				status: 200,
				gigsterId: room.gigsterId,
			});
			console.log(`Joined room: ${room.gigsterId}`);
		} catch (error) {
			console.error("Error fetching slots:", error);
			socket.emit("error", { status: 400, message: error.message });
		}
	});

	socket.on("leaveRoom", (room: { id: string }) => {
		try {
			socket.leave(`${room.id}`);
			console.log(`Left room: ${room.id}`);
		} catch (error) {
			console.error("Error leaving room:", error);
			socket.emit("error", "An error occurred while leaving the room");
		}
	});

	socket.on("bookSlot", async (data: any) => {
		try {
			const bookedSlot = await axios.post(`${baseURL}/bookSlot`, data);
			socket.emit("slotBooked", bookedSlot.data);
		} catch (error) {
			console.error("Error booking slot:", error);
			socket.emit("error", "An error occurred while booking the slot");
		}
	});

	socket.on("connect", () => {
		console.log("User connected");
	});

	//disconnect message of socket
	socket.on("disconnect", () => {
		console.log("User disconnected");
	});
});

server.listen(4000, () => {
	console.log("Server running on port 4000");
});
