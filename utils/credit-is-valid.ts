export default function creditIsvalid(credit: any) {
    return credit !== undefined && !credit.hasOwnProperty('success')
}