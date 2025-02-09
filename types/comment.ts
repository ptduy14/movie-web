export default interface IComment {
    id?: string,
    userName: string;
    userId: string;
    userAvata: string;
    text: string;
    timeStamp: string;
    likes: string[] | [];
}