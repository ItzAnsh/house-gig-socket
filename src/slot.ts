import { fetchSlots } from "./index";

export class AllSlots {
	private static instance: AllSlots;
	private slots: Slot[] = [];

	private constructor() {}

	// Singleton pattern to ensure only one instance of AllSlots exists
	static getInstance(): AllSlots {
		if (!AllSlots.instance) {
			AllSlots.instance = new AllSlots();
		}
		return AllSlots.instance;
	}

	addSlots(slot: Slot) {
		this.slots.push(slot);
	}

    async fetchSlots(id: string) {
        try {
            const slots = await fetchSlots(id);
            slots.forEach((slot) => {
                const slotInstance = new Slot(slot.id);
                slotInstance.addSlot(new SlotTime(slotInstance.getId()));
                this.addSlots(slotInstance);
            });
        } catch (error) {
            console.error("Error fetching slots:", error);
        }
    }

	getSlots(): Slot[] {
		return this.slots;
	}

	getAvailableSlots(): Slot[] {
		return this.slots.filter((slot) => slot.getAvailableSlots().length > 0);
	}

	getBookedSlots(): Slot[] {
		return this.slots.filter((slot) => slot.getBookedSlots().length > 0);
	}

	getSlotsByGigsterId(gigsterId: string): Slot[] {
		return this.slots.filter((slot) => slot.getId() === gigsterId);
	}
}

export class Slot implements SlotType {
	gigsterId: string;
	slots: SlotTime[] = [];

	constructor(gigsterId: string) {
		this.gigsterId = gigsterId;
	}

	getId(): string {
		return this.gigsterId;
	}

	addSlot(slotTime: SlotTime) {
		this.slots.push(slotTime);
	}

	getSlots(): SlotTime[] {
		return this.slots;
	}

	getAvailableSlots(): SlotTime[] {
		return this.slots.filter((slot) => !slot.isBooked());
	}

	getBookedSlots(): SlotTime[] {
		return this.slots.filter((slot) => slot.isBooked());
	}
}

export class SlotTime implements SlotTimeType {
	id: string;
	booked: boolean;

	constructor(id: string, booked: boolean = false) {
		this.id = id;
		this.booked = booked;
	}

	getId(): string {
		return this.id;
	}

	isBooked(): boolean {
		return this.booked;
	}

	bookSlot(): void {
		this.booked = true;
	}
}

// Type Definitions
export type SlotType = {
	gigsterId: string;
	slots: SlotTime[];
};

export type SlotTimeType = {
	id: string;
	booked: boolean;
};
