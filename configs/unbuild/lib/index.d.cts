import { BuildConfig } from 'unbuild';

interface IPathConfig {
    rootDir: string;
}
declare const presetConfig: BuildConfig;
declare function exportBuildConfig(pathConfig: IPathConfig, customConfig?: BuildConfig): BuildConfig[];

export { exportBuildConfig, presetConfig };
