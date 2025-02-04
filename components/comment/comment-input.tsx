import Image from "next/image";
import AccountDefaultImg from "../../public/account-default-img.jpg";

export default function CommentInput({authenticatedUser} : {authenticatedUser: any}) {
    return (
        <div>
            <div className="flex items-center space-x-3 border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white">
                <div>
                    <Image
                        src={authenticatedUser.photo || AccountDefaultImg}
                        alt="User Profile"
                        className="cursor-pointer rounded-full"
                        width={40}
                        height={40}
                    />
                </div>
                <input
                    type="text"
                    placeholder="Write a comment..."
                    className="flex-grow bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                />
            </div>
            <div className="text-right mt-3"><button type="button" className="bg-[#e20913] px-5 py-2 rounded-md">Bình luận</button></div>
        </div>
    );
}
