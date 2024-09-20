export default function replacePTag(content: string) {
    return content.replace(/<\/?p>/g, '');
}