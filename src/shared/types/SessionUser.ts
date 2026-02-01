export interface SessionUser {
    id: number;
    username: string;
    displayName?: string;
    photoUrl?: string;
    hardMode: boolean;
    role: string;
    hasTwitchLinked?: boolean;
}
