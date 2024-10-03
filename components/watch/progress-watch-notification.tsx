import convertSecondToTime from 'utils/convert-second-to-time';

export default function ProgresswatchNotification({
  isShowMessage,
  progressWatchInfo,
  handleAcceptProgressWatch,
  handleRejectProgressWatch
}: {
  isShowMessage: boolean;
  progressWatchInfo: {
    progressTime: number,
    progressEpIndex: number,
    progressEpLink: string
  },
  handleAcceptProgressWatch: () => void,
  handleRejectProgressWatch: () => void
}) {
    const {progressTime, progressEpIndex} = progressWatchInfo;
  return (
    <div
      className={`fixed top-16 ${
        isShowMessage ? 'right-8' : 'right-[-30rem]'
      }  bg-white z-20 text-black w-96 px-4 py-2 transition-all duration-500 space-y-4`}
    >
      <span className="">
        Hệ thống nhận thấy bạn đang xem đến{' '}
        <span className="font-bold">tập {progressEpIndex + 1}</span> -{' '}
        <span className="font-bold">{convertSecondToTime(progressTime)}</span>, bạn muốn tiếp tục
        xem chứ ?
      </span>
      <div className="flex items-center justify-center space-x-10">
        <button onClick={handleAcceptProgressWatch} className="px-6 py-2 bg-black text-white">Có</button>
        <button onClick={handleRejectProgressWatch} className="px-6 py-2 bg-[#5e5e5e] text-white">Xem lại từ đầu</button>
      </div>
    </div>
  );
}
