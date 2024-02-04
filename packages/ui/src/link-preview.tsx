"use client";

import { fetcher, getDomainWithoutWWW, getUrlFromString } from "@dub/utils";
import { Link2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { useMediaQuery } from "./hooks";
import { LoadingCircle, Photo } from "./icons";

export function LinkPreview({
  defaultUrl,
}: {
  defaultUrl?: string;
}): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url =
    defaultUrl || searchParams.get("url") || "https://github.com/dubinc/dub";
  const [debouncedUrl] = useDebounce(getUrlFromString(url), 500);
  const hostname = useMemo(() => {
    return getDomainWithoutWWW(debouncedUrl || "");
  }, [debouncedUrl]);

  const { data, isValidating } = useSWR<{
    title: string | null;
    description: string | null;
    image: string | null;
  }>(debouncedUrl && `/api/metatags?url=${debouncedUrl}`, fetcher, {
    revalidateOnFocus: false,
  });

  const { title, description, image } = data || {};

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!defaultUrl && inputRef.current) {
      inputRef.current.select();
    }
  }, [defaultUrl]);

  const { isMobile } = useMediaQuery();

  return (
    <>
      {!defaultUrl && (
        <div className="relative flex items-center">
          <Link2 className="absolute inset-y-0 left-0 my-2 ml-3 w-5 text-gray-400" />
          <input
            aria-invalid="true"
            autoFocus={!isMobile}
            className="block w-full rounded-md border-gray-200 pl-10 text-sm text-gray-900 placeholder-gray-400 shadow-lg focus:border-gray-500 focus:outline-none focus:ring-gray-500"
            defaultValue={url}
            id="url"
            name="url"
            onChange={(e) =>
              router.replace(
                `/tools/metatags${
                  e.target.value.length > 0 ? `?url=${e.target.value}` : ""
                }`,
              )
            }
            placeholder="Enter your URL"
            ref={inputRef}
            type="url"
          />
        </div>
      )}

      <div className="relative overflow-hidden rounded-md border border-gray-300 bg-gray-50">
        {isValidating ? (
          <div className="absolute flex h-[250px] w-full flex-col items-center justify-center space-y-4 border-b border-gray-300 bg-gray-50">
            <LoadingCircle />
          </div>
        ) : null}
        {image ? (
          <img
            alt="Preview"
            className="h-[250px] w-full border-b border-gray-300 object-cover"
            src={image}
          />
        ) : (
          <div className="flex h-[250px] w-full flex-col items-center justify-center space-y-4 border-b border-gray-300">
            <Photo className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-400">
              Enter a link to generate a preview.
            </p>
          </div>
        )}
        <div className="grid gap-1 bg-white p-3 text-left">
          {hostname ? (
            <p className="text-sm text-[#536471]">{hostname}</p>
          ) : (
            <div className="mb-1 h-4 w-24 rounded-md bg-gray-100" />
          )}
          {title ? (
            <h3 className="truncate text-sm font-medium text-[#0f1419]">
              {title}
            </h3>
          ) : (
            <div className="mb-1 h-4 w-full rounded-md bg-gray-100" />
          )}
          {description ? (
            <p className="line-clamp-2 text-sm text-[#536471]">{description}</p>
          ) : (
            <div className="grid gap-2">
              <div className="h-4 w-full rounded-md bg-gray-100" />
              <div className="h-4 w-48 rounded-md bg-gray-100" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function LinkPreviewPlaceholder({
  defaultUrl,
}: {
  defaultUrl?: string;
}): JSX.Element {
  return (
    <>
      <div className="relative flex items-center">
        <Link2 className="absolute inset-y-0 left-0 my-2 ml-3 w-5 text-gray-400" />
        <input
          className="block w-full rounded-md border-gray-200 pl-10 text-sm text-gray-900 placeholder-gray-400 shadow-lg focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          defaultValue={defaultUrl || "https://github.com/dubinc/dub"}
          disabled
          id="url"
          name="url"
          placeholder="Enter your URL"
          type="url"
        />
      </div>
      <div className="relative overflow-hidden rounded-md border border-gray-300 bg-gray-50">
        <div className="absolute flex h-[250px] w-full flex-col items-center justify-center space-y-4 border-b border-gray-300 bg-gray-50">
          <LoadingCircle />
        </div>
      </div>
    </>
  );
}
