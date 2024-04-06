import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		poolOptions: {
			forks: {
				// For API Testing, we only need one fork
				singleFork: true,
			},
		},
	},
});
