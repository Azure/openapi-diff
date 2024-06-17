export const fileUrl = (absPath: string) => {
  return `file:///${absPath.replace(/^\//, "").split("\\").join("/")}`
}
