export interface INotification {
    type: string,
    userActionName: string,
    timestamp: string,
    movieSlug: string,
    movieId: string,
    read: boolean
}