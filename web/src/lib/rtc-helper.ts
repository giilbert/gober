export const getRtcConfig = async () => {
  const res = await fetch("https://turnthing.vercel.app/api/credentials");
  const data = await res.json();
  return data.credentials;
};
