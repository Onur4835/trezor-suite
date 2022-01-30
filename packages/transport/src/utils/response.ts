export const success = <Payload>(payload: Payload) => ({ success: true as const, payload });

export const error = (error: string) => ({ success: false as const, error });
