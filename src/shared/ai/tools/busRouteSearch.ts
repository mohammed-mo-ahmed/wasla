import { getSupabase } from '@/shared/supabase/client';

type BusRouteRow = {
  line_number: string;
  path: string[];
  full_path: string;
};

function normalize(text: string): string {
  return text.replace(/[^\w\s]/g, '').replace(/\s+/g, '').toLowerCase();
}

async function getAllRoutes(): Promise<BusRouteRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('bus_routes')
    .select('line_number, path, full_path');

  if (error) {
    console.error('[busRouteSearch] Supabase error:', error.message);
    return [];
  }
  return (data ?? []) as BusRouteRow[];
}

export async function findBusBetween(
  origin: string,
  destination: string,
): Promise<{
  found: boolean;
  routes: Array<{ lineNumber: string; fullPath: string }>;
  text: string;
}> {
  const all = await getAllRoutes();
  if (all.length === 0) {
    return {
      found: false,
      routes: [],
      text: 'عذراً، قاعدة بيانات خطوط الأتوبيس غير متصلة حالياً.',
    };
  }

  const oNorm = normalize(origin);
  const dNorm = normalize(destination);

  const matched = all.filter((r) => {
    const pathText = normalize(r.full_path);
    return pathText.includes(oNorm) && pathText.includes(dNorm);
  });

  if (matched.length === 0) {
    return {
      found: false,
      routes: [],
      text: `لم أجد خط أتوبيس هيئة النقل العام بيعدي من "${origin}" ل "${destination}".`,
    };
  }

  const limited = matched.slice(0, 5);
  let text: string;
  if (limited.length === 1) {
    text = `أركب أتوبيس هيئة النقل العام رقم ${limited[0].line_number}.\nالمسار: ${limited[0].full_path}`;
  } else {
    text =
      `لقيت ${matched.length} خطوط أتوبيس هيئة النقل العام بتعدي من "${origin}" ل "${destination}":\n` +
      limited
        .map((r) => `• أركب أتوبيس رقم ${r.line_number}: ${r.full_path}`)
        .join('\n');
    if (matched.length > 5) {
      text += `\n... و ${matched.length - 5} نتائج أخرى.`;
    }
  }

  return {
    found: true,
    routes: limited.map((r) => ({
      lineNumber: r.line_number,
      fullPath: r.full_path,
    })),
    text,
  };
}

export async function searchBusLine(
  query: string,
): Promise<{
  found: boolean;
  routes: Array<{ lineNumber: string; fullPath: string }>;
  text: string;
}> {
  const all = await getAllRoutes();
  if (all.length === 0) {
    return {
      found: false,
      routes: [],
      text: 'عذراً، قاعدة بيانات خطوط الأتوبيس غير متصلة حالياً.',
    };
  }

  const q = query.trim().toLowerCase();

  if (!q) {
    return {
      found: false,
      routes: [],
      text: 'من فضلك أدخل رقم خط الأتوبيس أو اسم منطقة للبحث.',
    };
  }

  const matched = all.filter((r) => {
    const lineMatch =
      r.line_number.replace(/\s+/g, '').toLowerCase() ===
      q.replace(/\s+/g, '');
    const pathMatch = r.path.some((p) => p.toLowerCase().includes(q));
    const fullPathMatch = r.full_path.toLowerCase().includes(q);
    return lineMatch || pathMatch || fullPathMatch;
  });

  if (matched.length === 0) {
    return {
      found: false,
      routes: [],
      text: `لم أجد خط أتوبيس يطابق "${query}". جرب البحث برقم الخط أو اسم منطقة.`,
    };
  }

  const limited = matched.slice(0, 5);

  let text: string;
  if (limited.length === 1) {
    const r = limited[0];
    text = `خط أتوبيس رقم ${r.line_number}:\nالمسار: ${r.full_path}`;
  } else {
    text =
      `لقيت ${matched.length} خط أتوبيس:\n` +
      limited
        .map((r) => `• خط ${r.line_number}: ${r.full_path}`)
        .join('\n');
    if (matched.length > 5) {
      text += `\n... و ${matched.length - 5} نتائج أخرى.`;
    }
  }

  return {
    found: true,
    routes: limited.map((r) => ({
      lineNumber: r.line_number,
      fullPath: r.full_path,
    })),
    text,
  };
}
