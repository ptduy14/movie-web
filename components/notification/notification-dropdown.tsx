import NotificationList from "./notification-list";

export default function NotificationDropDown() {

    return <div className="absolute bg-black right-0 top-[3.625rem] min-w-[24rem] rounded-lg shadow-lg border border-slate-600 py-4">
        <div className="pb-4 px-5 flex justify-between items-center">
            <div className="font-bold">
                Thông báo
            </div>
            <div className="text-sm hover:bg-custome-red rounded-lg transition-all py-2 px-2 cursor-pointer ">
                Đánh dấu đã đọc
            </div>
        </div>
        <div className="">
            {/* <div className="px-5">Không có thông báo</div> */}
            <NotificationList />
        </div>
    </div>
}