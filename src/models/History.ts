export class History<T> {
    private items: T[] = [];

    // Adds an element to the back of the queue
    enqueue(element: T): void {
        this.items.push(element);
    }

    // Removes the element from the front of the queue
    dequeue(): T | undefined {
        return this.items.shift();
    }

    // Removes the element from the back of the queue
    rollback(): T | undefined {
        return this.items.pop();
    }

    // Returns the element at the front of the queue without removing it
    front(): T | undefined {
        return this.items[0];
    }

    // Returns the element at the back of the queue without removing it
    back(): T | undefined {
        return this.items[this.items.length - 1];
    }

    // Checks if the queue is empty
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // Returns the number of elements in the queue
    size(): number {
        return this.items.length;
    }

    // Return the element by index
    get(index: number): T | undefined {
        return this.items[index];
    }
}