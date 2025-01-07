import { RsbuildConfig } from '@rsbuild/core';

interface IRsbuildVueConfig extends RsbuildConfig {
    rootDir: string;
    assetsDir: string;
    vueVersion?: '2' | '3';
    useVuemd: boolean;
}
declare function defineVueConfig(configs: IRsbuildVueConfig, options: RsbuildConfig): RsbuildConfig;

export { defineVueConfig };
