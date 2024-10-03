export default function convertSecondToTime(second: number | null): string {
    if (!second) return '';

    let h = Math.floor(second / 3600); // Tính số giờ
    let m = Math.floor((second - (h * 3600)) / 60); // Tính số phút
    let s = Math.round(second - (h * 3600) - (m * 60)); // Tính số giây

    // Định dạng kết quả với hai chữ số cho giờ, phút, và giây
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
