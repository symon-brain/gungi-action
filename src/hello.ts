/**
 * Greets a person with a personalized message.
 *
 * @param name - The name of the person to greet
 * @returns A greeting message in the format "Hello, {name}!"
 *
 * @example
 * ```typescript
 * greet("World"); // Returns "Hello, World!"
 * greet("Alice"); // Returns "Hello, Alice!"
 * ```
 */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
