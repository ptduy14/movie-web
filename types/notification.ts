export interface INotification {
    id?: string,
    type: string,
    userCreatedName: string,
    userCreatedId: string,
    userReciveName: string,
    userReciveId: string,
    timestamp: string,
    movieSlug: string,
    movieId: string,
    read: boolean,
}

export interface INotificationDropdownState {
    isOpenInHeaderDefault: boolean;
    isOpenInHeaderFixed: boolean;
}