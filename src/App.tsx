import { useState, useMemo } from 'react';
import { optimize } from 'svgo/browser';
import './App.css';

import HomeIcon from './assets/icons/home.svg?react';
import SearchIcon from './assets/icons/search.svg?react';
import UserIcon from './assets/icons/user.svg?react';
import SettingsIcon from './assets/icons/settings.svg?react';
import BellIcon from './assets/icons/bell.svg?react';
import ChartIcon from './assets/icons/chart.svg?react';

import homeRaw from './assets/icons/home.svg?raw';
import searchRaw from './assets/icons/search.svg?raw';
import userRaw from './assets/icons/user.svg?raw';
import settingsRaw from './assets/icons/settings.svg?raw';
import bellRaw from './assets/icons/bell.svg?raw';
import chartRaw from './assets/icons/chart.svg?raw';

const icons = [
  { name: 'Home', Component: HomeIcon, raw: homeRaw },
  { name: 'Search', Component: SearchIcon, raw: searchRaw },
  { name: 'User', Component: UserIcon, raw: userRaw },
  { name: 'Settings', Component: SettingsIcon, raw: settingsRaw },
  { name: 'Bell', Component: BellIcon, raw: bellRaw },
  { name: 'Chart', Component: ChartIcon, raw: chartRaw },
];

const availablePlugins = [
  { name: 'removeComments', label: 'Remove comments', description: 'Removes XML comments from SVG' },
  { name: 'removeMetadata', label: 'Remove metadata', description: 'Removes <metadata> tags with RDF/Dublin Core' },
  { name: 'removeEditorsNSData', label: 'Remove editor namespaces', description: 'Removes xmlns from Illustrator, Sketch, Inkscape, etc' },
  { name: 'removeEmptyContainers', label: 'Remove empty containers', description: 'Removes empty <g>, <defs> and other containers' },
  { name: 'collapseGroups', label: 'Collapse groups', description: 'Flattens unnecessary wrapping <g> elements' },
  { name: 'removeHiddenElems', label: 'Remove hidden elements', description: 'Removes elements with display="none" or visibility="hidden"' },
  { name: 'removeUselessDefs', label: 'Remove unused defs', description: 'Removes unreferenced filters, clipPaths, gradients' },
  { name: 'removeEmptyAttrs', label: 'Remove empty attributes', description: 'Removes attributes with empty values' },
  { name: 'cleanupNumericValues', label: 'Cleanup numeric values', description: 'Removes unnecessary zeros (50.0000 → 50)' },
  { name: 'cleanupIds', label: 'Cleanup IDs', description: 'Removes or minifies unreferenced IDs' },
  { name: 'removeXMLProcInst', label: 'Remove <?xml?>', description: 'Removes unnecessary XML declaration for browsers' },
  { name: 'removeDoctype', label: 'Remove DOCTYPE', description: 'Removes DOCTYPE declaration' },
  { name: 'minifyStyles', label: 'Minify styles', description: 'Minifies <style> blocks inside SVG' },
  { name: 'convertPathData', label: 'Optimize paths', description: 'Simplifies <path> commands (M, L, C → shorter forms)' },
  { name: 'removeUnknownsAndDefaults', label: 'Remove default attributes', description: 'Removes attributes with values that are already the default' },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function App() {
  const [selected, setSelected] = useState<number | null>(null);
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>(
    () => Object.fromEntries(availablePlugins.map((p) => [p.name, true])),
  );

  const togglePlugin = (name: string) => {
    setEnabledPlugins((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const activePluginsKey = availablePlugins
    .filter((p) => enabledPlugins[p.name])
    .map((p) => p.name)
    .join(',');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgoConfig: any = useMemo(
    () => ({
      multipass: true,
      plugins: activePluginsKey ? activePluginsKey.split(',') : [],
    }),
    [activePluginsKey],
  );

  const selectedIcon = selected !== null ? icons[selected] : null;

  const optimized = selectedIcon
    ? optimize(selectedIcon.raw, svgoConfig)
    : null;

  const beforeSize = selectedIcon ? new Blob([selectedIcon.raw]).size : 0;
  const afterSize = optimized ? new Blob([optimized.data]).size : 0;
  const reduction = beforeSize > 0 ? ((1 - afterSize / beforeSize) * 100).toFixed(0) : '0';

  const totalBefore = icons.reduce((sum, icon) => sum + new Blob([icon.raw]).size, 0);
  const totalAfter = icons.reduce((sum, icon) => {
    const result = optimize(icon.raw, svgoConfig);
    return sum + new Blob([result.data]).size;
  }, 0);

  const allEnabled = availablePlugins.every((p) => enabledPlugins[p.name]);
  const noneEnabled = availablePlugins.every((p) => !enabledPlugins[p.name]);

  const toggleAll = () => {
    const newValue = !allEnabled;
    setEnabledPlugins(
      Object.fromEntries(availablePlugins.map((p) => [p.name, newValue])),
    );
  };

  return (
    <div className="app">
      <header>
        <h1>SVGO Demo</h1>
        <p className="subtitle">
          Click an icon to see the before and after optimization
        </p>
      </header>

      <section className="stats-bar">
        <div className="stat">
          <span className="stat-label">SVGs in project</span>
          <span className="stat-value">{icons.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total size (original)</span>
          <span className="stat-value danger">{formatBytes(totalBefore)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total size (optimized)</span>
          <span className="stat-value success">{formatBytes(totalAfter)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Reduction</span>
          <span className="stat-value success">
            {noneEnabled ? '0' : ((1 - totalAfter / totalBefore) * 100).toFixed(0)}%
          </span>
        </div>
      </section>

      <section className="icons-grid">
        {icons.map((icon, i) => (
          <button
            key={icon.name}
            className={`icon-card ${selected === i ? 'active' : ''}`}
            onClick={() => setSelected(selected === i ? null : i)}
          >
            <icon.Component className="icon-preview" />
            <span className="icon-name">{icon.name}</span>
            <span className="icon-size">{formatBytes(new Blob([icon.raw]).size)}</span>
          </button>
        ))}
      </section>

      <section className="plugins-section">
        <div className="plugins-header">
          <h2>Plugins</h2>
          <button className="toggle-all-btn" onClick={toggleAll}>
            {allEnabled ? 'Disable all' : 'Enable all'}
          </button>
        </div>
        <div className="plugins-grid">
          {availablePlugins.map((plugin) => (
            <button
              key={plugin.name}
              className={`plugin-chip ${enabledPlugins[plugin.name] ? 'enabled' : 'disabled'}`}
              onClick={() => togglePlugin(plugin.name)}
              title={plugin.description}
            >
              <span className="plugin-indicator">{enabledPlugins[plugin.name] ? '●' : '○'}</span>
              <span className="plugin-label">{plugin.label}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedIcon && optimized && (
        <section className="comparison">
          <div className="comparison-header">
            <h2>{selectedIcon.name}</h2>
            <div className="comparison-stats">
              <span className="badge danger">{formatBytes(beforeSize)}</span>
              <span className="arrow">→</span>
              <span className="badge success">{formatBytes(afterSize)}</span>
              <span className="badge reduction">-{reduction}%</span>
            </div>
          </div>
          <div className="preview-panels">
            <div className="preview-panel">
              <div
                className="preview-icon"
                dangerouslySetInnerHTML={{ __html: selectedIcon.raw }}
              />
              <span className="badge danger">{formatBytes(beforeSize)}</span>
            </div>
            <div className="preview-panel">
              <div
                className="preview-icon"
                dangerouslySetInnerHTML={{ __html: optimized.data }}
              />
              <span className="badge success">{formatBytes(afterSize)}</span>
            </div>
          </div>
          <div className="code-panels">
            <div className="code-panel">
              <h3>
                Before <span className="tag danger">Original</span>
              </h3>
              <pre><code>{selectedIcon.raw}</code></pre>
            </div>
            <div className="code-panel">
              <h3>
                After <span className="tag success">SVGO</span>
              </h3>
              <pre><code>{optimized.data}</code></pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;