export async function fetchDailymotionHlsUrl(videoId) {
  try {
    const res = await fetch(`https://www.dailymotion.com/player/metadata/video/${videoId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.qualities?.auto?.[0]?.url || null;
  } catch {
    return null;
  }
}
