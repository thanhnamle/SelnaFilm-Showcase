import { useRouteError } from 'react-router';

// Rendered outside the locale layout, so it reads the locale from the URL itself.
const COPY = {
  vi: { title: 'Có lỗi xảy ra', desc: 'Một thứ gì đó không chạy như mong đợi. Thử tải lại trang nhé.', retry: 'Tải lại' },
  en: { title: 'Something went wrong', desc: "Something didn't work as expected. Try reloading the page.", retry: 'Reload' },
};

export default function ErrorPage() {
  const error = useRouteError();
  const copy = location.pathname.startsWith('/en') ? COPY.en : COPY.vi;
  console.error(error);

  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-muted">{copy.desc}</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-8 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/85"
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
