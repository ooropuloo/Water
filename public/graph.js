async function loadGraph() {
  const res = await fetch('/api/graph');
  const data = await res.json();
  const elements = [];
  data.nodes.forEach(n => {
    elements.push({ data: { id: n.id, label: n.label } });
  });
  data.edges.forEach(e => {
    elements.push({ data: { id: e.id, source: e.source, target: e.target, label: e.label } });
  });
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    style: [
      { selector: 'node', style: { 'content': 'data(label)' } },
      { selector: 'edge', style: { 'label': 'data(label)', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle' } }
    ],
    layout: { name: 'cose' }
  });
}

loadGraph();
