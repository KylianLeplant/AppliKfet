import { convertFileSrc } from '@tauri-apps/api/core';

const WINDOWS_ABSOLUTE_PATH = /^[a-zA-Z]:[\\/]/;
const UNC_PATH = /^\\\\/;

export function resolveImageSrc(imagePath: string | null | undefined): string | null {
	const normalizedPath = imagePath?.trim();

	if (!normalizedPath) {
		return null;
	}

	if (
		normalizedPath.startsWith('http://') ||
		normalizedPath.startsWith('https://') ||
		normalizedPath.startsWith('data:') ||
		normalizedPath.startsWith('blob:')
	) {
		return normalizedPath;
	}

	if (normalizedPath.startsWith('static/')) {
		return `/${normalizedPath.slice('static/'.length)}`;
	}

	if (
		normalizedPath.startsWith('/products/') ||
		normalizedPath.startsWith('/products_categories/')
	) {
		return normalizedPath;
	}

	if (
		WINDOWS_ABSOLUTE_PATH.test(normalizedPath) ||
		UNC_PATH.test(normalizedPath) ||
		normalizedPath.startsWith('/')
	) {
		return convertFileSrc(normalizedPath);
	}

	return normalizedPath;
}