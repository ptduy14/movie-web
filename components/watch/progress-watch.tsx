export default function Progresswatch({isShowMessage}: {isShowMessage: boolean}) {
    return <div className={`fixed top-16 ${isShowMessage ? 'right-8' : 'right-[-30rem]'}  bg-white z-20 text-black w-96 px-4 py-2 transition-all duration-500`}>
        <span className="">Hệ thống nhận thấy bạn đã xem phim này trước đó, chúng tôi đã tự động chuyển tiếp đến phần bạn đang xem. Chúc bạn có trãi nghiệm xem phim vui vẻ! (sau 10s thông báo này sẽ tự tắt do chưa làm xong 🫠)</span>
    </div>
}