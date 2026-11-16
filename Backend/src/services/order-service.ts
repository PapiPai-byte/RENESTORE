export interface Order {
  /** Optional unique identifier – will be generated if not provided */
  id?: string | number;
  /** Customer reference */
  customerId: string;
  /** List of line items */
  items: { productId: string; quantity: number }[];
  /** Total amount in the smallest currency unit (e.g., cents) */
  totalCents: number;
  /** ISO timestamp when the order was created */
  createdAt: string;
}

/** Simple status representation for an order */
export interface OrderStatus {
  /** Order identifier */
  id: string;
  /** Current status */
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  /** Optional timestamp */
  updatedAt?: string;
}

/**
 * Service that encapsulates order‑related operations.
 * All methods are async to reflect typical I/O (e.g., DB, external API) usage.
 */
export class OrderService {
  /**
   * Creates a new order.
   * @param order - The order data to persist.
   * @returns The created order (including generated identifiers).
   */
  async createOrder(order: Order): Promise<Order> {
    // TODO: replace with actual persistence logic (DB, external API, etc.)
    // For now we just return the order with a generated id.
    const generatedId = `order_${Date.now()}`;
    return { ...order, id: generatedId };
  }

  /**
   * Retrieves an order by its identifier.
   * @param id - The order identifier (string or numeric).
   * @returns The order details if found.
   */
  async getOrder(id: string | number): Promise<OrderStatus> {
    // TODO: replace with actual fetch logic.
    // Here we simulate a pending order.
    // Cast `id` to `string` to match the `OrderStatus` type.
    return { id: String(id), status: 'pending' } as OrderStatus;
  }
}

/* Export a singleton instance for convenience */
export default new OrderService();