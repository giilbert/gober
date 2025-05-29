export const getRtcConfig = async () => {
  const res = await fetch("https://turnthing.vercel.app/api/credentials");
  return await res.json();
};
