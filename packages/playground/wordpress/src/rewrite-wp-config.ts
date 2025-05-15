import { phpVars } from '@php-wasm/util';
import type { UniversalPHP } from '@php-wasm/universal';

/* @ts-ignore */
import rewriteWpConfigToDefineConstants from './rewrite-wp-config-to-define-constants.php?raw';

/**
 * Defines constants in a WordPress "wp-config.php" file.
 *
 * @param php                The PHP instance.
 * @param wpConfigPath       The path to the "wp-config.php" file.
 * @param constants          The constants to define.
 * @param whenAlreadyDefined What to do if the constant is already defined.
 *                           Possible values are:
 *                             'rewrite' - Rewrite the constant, using the new value.
 *                             'skip'    - Skip the definition, keeping the existing value.
 */
export async function defineWpConfigConstants(
	php: UniversalPHP,
	wpConfigPath: string,
	constants: Record<string, unknown>,
	whenAlreadyDefined: 'rewrite' | 'skip' = 'rewrite'
): Promise<void> {
	const js = phpVars({ wpConfigPath, constants, whenAlreadyDefined });
	const result = await php.run({
		code: `${rewriteWpConfigToDefineConstants}
			$wp_config_path = ${js.wpConfigPath};
			$wp_config = file_get_contents($wp_config_path);
			$new_wp_config = rewrite_wp_config_to_define_constants($wp_config, ${js.constants}, ${js.whenAlreadyDefined});
			$return_value = file_put_contents($wp_config_path, $new_wp_config);
			echo false === $return_value ? '0' : '1';
		`,
	});
	if (result.text !== '1') {
		throw new Error('Failed to rewrite constants in wp-config.php.');
	}
}

/**
 * Ensures that required constants are defined in the "wp-config.php" file.
 *
 * When a required constant is missing, it will be defined with a default value.
 *
 * @param php          The PHP instance.
 * @param wpConfigPath The path to the "wp-config.php" file.
 */
export async function ensureRequiredWpConfigConstants(
	php: UniversalPHP,
	wpConfigPath: string
): Promise<void> {
	const defaults = {
		DB_NAME: 'wordpress',
	};
	await defineWpConfigConstants(php, wpConfigPath, defaults, 'skip');
}
