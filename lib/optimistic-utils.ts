/**
 * Utility functions and patterns for optimistic UI updates
 */

/**
 * Common optimistic update patterns
 */

/**
 * Optimistic update for toggling a boolean value (like/unlike, follow/unfollow)
 */
export function createToggleOptimistic<T extends Record<string, any>>(key: keyof T) {
    return (currentState: T, _data: any): T => ({
        ...currentState,
        [key]: !currentState[key],
    });
}

/**
 * Optimistic update for incrementing a number (likes, views, etc.)
 */
export function createIncrementOptimistic<T extends Record<string, any>>(key: keyof T) {
    return (currentState: T, increment: number): T => ({
        ...currentState,
        [key]: (currentState[key] as number) + increment,
    });
}

/**
 * Optimistic update for adding an item to an array
 */
export function createAddItemOptimistic<T, Item>(
    getArray: (state: T) => Item[],
    setArray: (state: T, items: Item[]) => T,
) {
    return (currentState: T, newItem: Item): T => {
        const currentArray = getArray(currentState);
        return setArray(currentState, [...currentArray, newItem]);
    };
}

/**
 * Optimistic update for removing an item from an array
 */
export function createRemoveItemOptimistic<T, Item>(
    getArray: (state: T) => Item[],
    setArray: (state: T, items: Item[]) => T,
    getId: (item: Item) => string | number,
) {
    return (currentState: T, itemId: string | number): T => {
        const currentArray = getArray(currentState);
        return setArray(
            currentState,
            currentArray.filter((item) => getId(item) !== itemId),
        );
    };
}

/**
 * Optimistic update for updating an item in an array
 */
export function createUpdateItemOptimistic<T, Item>(
    getArray: (state: T) => Item[],
    setArray: (state: T, items: Item[]) => T,
    getId: (item: Item) => string | number,
) {
    return (currentState: T, updatedItem: Partial<Item> & { id: string | number }): T => {
        const currentArray = getArray(currentState);
        return setArray(
            currentState,
            currentArray.map((item) =>
                getId(item) === updatedItem.id ? { ...item, ...updatedItem } : item,
            ),
        );
    };
}

/**
 * Optimistic update for updating a nested property
 */
export function createUpdatePropertyOptimistic<T>(path: string[]) {
    return (currentState: T, value: any): T => {
        const result = { ...currentState };
        let current: any = result;

        for (let i = 0; i < path.length - 1; i++) {
            current[path[i]] = { ...current[path[i]] };
            current = current[path[i]];
        }

        current[path[path.length - 1]] = value;
        return result;
    };
}

/**
 * Example usage patterns
 */

// Example 1: Like/Unlike
export const likeOptimistic = createToggleOptimistic<{ isLiked: boolean; likes: number }>(
    'isLiked',
);

// Example 2: Increment likes count
export const incrementLikesOptimistic = createIncrementOptimistic<{ likes: number }>('likes');

// Example 3: Add comment
interface Comment {
    id: string;
    text: string;
    author: string;
}

interface PostState {
    comments: Comment[];
    commentCount: number;
}

export const addCommentOptimistic = (currentState: PostState, newComment: Comment): PostState => ({
    ...currentState,
    comments: [...currentState.comments, newComment],
    commentCount: currentState.commentCount + 1,
});

// Example 4: Remove comment
export const removeCommentOptimistic = (currentState: PostState, commentId: string): PostState => ({
    ...currentState,
    comments: currentState.comments.filter((c) => c.id !== commentId),
    commentCount: currentState.commentCount - 1,
});

/**
 * Helper to create a temporary ID for optimistic items
 */
export function createOptimisticId(): string {
    return `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to check if an ID is optimistic
 */
export function isOptimisticId(id: string): boolean {
    return id.startsWith('optimistic-');
}
