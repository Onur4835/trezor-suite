export const success = <Payload>(payload: Payload) => {
    return { success: true as const, payload };
};

export const error = (error: string) => {
    return { success: false as const, error };
};
