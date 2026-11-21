declare namespace App {
  interface Locals {
    user: import('../db/schema').User | null;
  }

  interface SessionData {
    userId: number;
    authAt: number;
  }
}
