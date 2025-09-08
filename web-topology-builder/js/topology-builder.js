// Network Topology Builder JavaScript

class TopologyBuilder {
    constructor() {
        this.canvas = document.getElementById('topology-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.devices = [];
        this.links = [];
        this.selectedDevice = null;
        this.selectedLink = null;
        this.draggedDevice = null;
        this.isDrawingLink = false;
        this.linkStart = null;
        this.deviceCounter = 0;
        this.linkCounter = 0;

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.resizeCanvas();
        this.updateSummary();
        this.draw();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = 600;
    }

    setupEventListeners() {
        // Device drag and drop - ensure we handle drag on the correct element
        document.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                // Ensure we get the data-type from the correct element
                const deviceType = e.currentTarget.dataset.type || e.target.closest('.device-item').dataset.type;
                e.dataTransfer.setData('text/plain', deviceType);
                e.dataTransfer.effectAllowed = 'copy';
                console.log('Starting drag for device type:', deviceType);
                this.updateDebugInfo(`Dragging ${deviceType} device`);
            });

            item.addEventListener('dragend', (e) => {
                console.log('Drag ended');
                this.updateDebugInfo('Drag ended');
            });
        });

        // Canvas events
        this.canvas.addEventListener('drop', this.handleCanvasDrop.bind(this));
        this.canvas.addEventListener('dragover', this.handleCanvasDragOver.bind(this));
        this.canvas.addEventListener('dragenter', (e) => {
            e.preventDefault();
            console.log('Drag entered canvas');
        });
        this.canvas.addEventListener('dragleave', (e) => {
            console.log('Drag left canvas');
        });
        this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleCanvasDoubleClick.bind(this));

        // Button events
        document.getElementById('clear-canvas').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('export-topology').addEventListener('click', this.exportTopology.bind(this));
        document.getElementById('export-configs').addEventListener('click', this.exportConfigs.bind(this));

        // Modal events
        this.setupModalEvents();

        // Window resize
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        console.log('Event listeners set up');
    }

    setupModalEvents() {
        // Device modal
        document.getElementById('save-device').addEventListener('click', this.saveDeviceConfig.bind(this));
        document.getElementById('cancel-device').addEventListener('click', this.hideDeviceModal.bind(this));

        // Link modal
        document.getElementById('save-link').addEventListener('click', this.saveLinkConfig.bind(this));
        document.getElementById('cancel-link').addEventListener('click', this.hideLinkModal.bind(this));

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(close => {
            close.addEventListener('click', this.hideAllModals.bind(this));
        });

        // Device type change
        document.getElementById('device-type').addEventListener('change', this.handleDeviceTypeChange.bind(this));
    }

    handleCanvasDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        console.log('Drop event triggered');

        const deviceType = e.dataTransfer.getData('text/plain');
        console.log('Device type from drop:', deviceType);

        if (deviceType) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('Drop coordinates:', x, y);

            const device = this.addDevice(deviceType, x, y);
            console.log('Device added:', device);
        } else {
            console.log('No device type found in drop data');
        }
    }

    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on a device
        const device = this.getDeviceAtPosition(x, y);
        if (device) {
            this.draggedDevice = device;
            this.selectedDevice = device;
            this.selectedLink = null;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Check if clicking on a link
        const link = this.getLinkAtPosition(x, y);
        if (link) {
            this.selectedLink = link;
            this.selectedDevice = null;
            this.showLinkModal(link);
            return;
        }

        // Start drawing link
        this.isDrawingLink = true;
        this.linkStart = { x, y };
        this.selectedDevice = null;
        this.selectedLink = null;
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.draggedDevice) {
            this.draggedDevice.x = x;
            this.draggedDevice.y = y;
            this.draw();
        } else if (this.isDrawingLink && this.linkStart) {
            this.draw();
            this.drawLinkPreview(this.linkStart.x, this.linkStart.y, x, y);
        }
    }

    handleCanvasMouseUp(e) {
        if (this.draggedDevice) {
            this.draggedDevice = null;
            this.canvas.style.cursor = 'crosshair';
        } else if (this.isDrawingLink && this.linkStart) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const startDevice = this.getDeviceAtPosition(this.linkStart.x, this.linkStart.y);
            const endDevice = this.getDeviceAtPosition(x, y);

            if (startDevice && endDevice && startDevice !== endDevice) {
                this.addLink(startDevice, endDevice);
            }

            this.isDrawingLink = false;
            this.linkStart = null;
            this.draw();
        }
    }

    handleCanvasDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const device = this.getDeviceAtPosition(x, y);
        if (device) {
            this.showDeviceModal(device);
        }
    }

    handleDeviceTypeChange(e) {
        const routerConfig = document.getElementById('router-config');
        if (e.target.value === 'ceos') {
            routerConfig.classList.remove('hidden');
        } else {
            routerConfig.classList.add('hidden');
        }
    }

    addDevice(type, x, y) {
        this.deviceCounter++;
        const device = {
            id: this.deviceCounter,
            type: type,
            name: `${type}${this.deviceCounter}`,
            x: x,
            y: y,
            width: 80,
            height: 60,
            config: {
                hostname: `${type}${this.deviceCounter}`,
                mgmtIp: `192.168.101.${10 + this.deviceCounter}`,
                loopbackIp: `10.255.1.${this.deviceCounter}`,
                asn: type === 'ceos' ? '65000' : null
            }
        };

        this.devices.push(device);
        this.updateSummary();
        this.draw();
        this.updateDebugInfo(`Added ${type} device: ${device.name}`);
        return device;
    }

    addLink(deviceA, deviceB) {
        this.linkCounter++;
        const link = {
            id: this.linkCounter,
            deviceA: deviceA,
            deviceB: deviceB,
            interfaceA: `eth${this.getNextInterface(deviceA)}`,
            interfaceB: `eth${this.getNextInterface(deviceB)}`,
            ipA: '',
            ipB: ''
        };

        this.links.push(link);
        this.updateSummary();
        this.draw();
        return link;
    }

    getNextInterface(device) {
        const usedInterfaces = this.links
            .filter(link => link.deviceA === device || link.deviceB === device)
            .map(link => {
                if (link.deviceA === device) return parseInt(link.interfaceA.replace('eth', ''));
                if (link.deviceB === device) return parseInt(link.interfaceB.replace('eth', ''));
                return 0;
            });

        let nextIntf = 1;
        while (usedInterfaces.includes(nextIntf)) {
            nextIntf++;
        }
        return nextIntf;
    }

    getDeviceAtPosition(x, y) {
        return this.devices.find(device =>
            x >= device.x - device.width/2 &&
            x <= device.x + device.width/2 &&
            y >= device.y - device.height/2 &&
            y <= device.y + device.height/2
        );
    }

    getLinkAtPosition(x, y) {
        return this.links.find(link => {
            const dx = link.deviceB.x - link.deviceA.x;
            const dy = link.deviceB.y - link.deviceA.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) return false;

            const ux = dx / length;
            const uy = dy / length;

            const vx = x - link.deviceA.x;
            const vy = y - link.deviceA.y;

            const t = Math.max(0, Math.min(length, vx * ux + vy * uy));
            const closestX = link.deviceA.x + t * ux;
            const closestY = link.deviceA.y + t * uy;

            const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
            return distance < 5;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw links first
        this.links.forEach(link => this.drawLink(link));

        // Draw devices
        this.devices.forEach(device => this.drawDevice(device));
    }

    drawDevice(device) {
        const { x, y, width, height, type, name, config } = device;

        // Device body
        this.ctx.fillStyle = type === 'ceos' ? '#667eea' : '#4caf50';
        this.ctx.fillRect(x - width/2, y - height/2, width, height);

        // Device border
        this.ctx.strokeStyle = this.selectedDevice === device ? '#ff6b6b' : '#333';
        this.ctx.lineWidth = this.selectedDevice === device ? 3 : 1;
        this.ctx.strokeRect(x - width/2, y - height/2, width, height);

        // Device icon
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px FontAwesome';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(type === 'ceos' ? '\uf233' : '\uf17c', x, y - 5);

        // Device name
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(name, x, y + height/2 + 15);

        // Management IP
        if (config.mgmtIp) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(config.mgmtIp, x, y + height/2 + 28);
        }
    }

    drawLink(link) {
        const { deviceA, deviceB } = link;

        this.ctx.strokeStyle = this.selectedLink === link ? '#ff6b6b' : '#667eea';
        this.ctx.lineWidth = this.selectedLink === link ? 3 : 2;
        this.ctx.beginPath();
        this.ctx.moveTo(deviceA.x, deviceA.y);
        this.ctx.lineTo(deviceB.x, deviceB.y);
        this.ctx.stroke();

        // Draw link label
        const midX = (deviceA.x + deviceB.x) / 2;
        const midY = (deviceA.y + deviceB.y) / 2;

        this.ctx.fillStyle = '#333';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${link.interfaceA}-${link.interfaceB}`, midX, midY - 5);
    }

    drawLinkPreview(startX, startY, endX, endY) {
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    showDeviceModal(device) {
        const modal = document.getElementById('device-modal');
        const nameInput = document.getElementById('device-name');
        const typeSelect = document.getElementById('device-type');
        const hostnameInput = document.getElementById('hostname');
        const mgmtIpInput = document.getElementById('mgmt-ip');
        const loopbackIpInput = document.getElementById('loopback-ip');
        const asnInput = document.getElementById('asn');

        nameInput.value = device.name;
        typeSelect.value = device.type;
        hostnameInput.value = device.config.hostname || '';
        mgmtIpInput.value = device.config.mgmtIp || '';
        loopbackIpInput.value = device.config.loopbackIp || '';
        asnInput.value = device.config.asn || '';

        this.handleDeviceTypeChange({ target: typeSelect });
        modal.classList.remove('hidden');
    }

    showLinkModal(link) {
        const modal = document.getElementById('link-modal');
        const endpointA = document.getElementById('endpoint-a');
        const endpointB = document.getElementById('endpoint-b');
        const ipA = document.getElementById('ip-a');
        const ipB = document.getElementById('ip-b');

        // Populate interface options
        this.populateInterfaceOptions(endpointA, link.deviceA);
        this.populateInterfaceOptions(endpointB, link.deviceB);

        endpointA.value = link.interfaceA;
        endpointB.value = link.interfaceB;
        ipA.value = link.ipA || '';
        ipB.value = link.ipB || '';

        modal.classList.remove('hidden');
    }

    populateInterfaceOptions(select, device) {
        select.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const option = document.createElement('option');
            option.value = `eth${i}`;
            option.textContent = `eth${i}`;
            select.appendChild(option);
        }
    }

    saveDeviceConfig() {
        if (!this.selectedDevice) return;

        const nameInput = document.getElementById('device-name');
        const hostnameInput = document.getElementById('hostname');
        const mgmtIpInput = document.getElementById('mgmt-ip');
        const loopbackIpInput = document.getElementById('loopback-ip');
        const asnInput = document.getElementById('asn');

        this.selectedDevice.name = nameInput.value;
        this.selectedDevice.config.hostname = hostnameInput.value;
        this.selectedDevice.config.mgmtIp = mgmtIpInput.value;
        this.selectedDevice.config.loopbackIp = loopbackIpInput.value;
        this.selectedDevice.config.asn = asnInput.value;

        this.hideDeviceModal();
        this.draw();
    }

    saveLinkConfig() {
        if (!this.selectedLink) return;

        const endpointA = document.getElementById('endpoint-a');
        const endpointB = document.getElementById('endpoint-b');
        const ipA = document.getElementById('ip-a');
        const ipB = document.getElementById('ip-b');

        this.selectedLink.interfaceA = endpointA.value;
        this.selectedLink.interfaceB = endpointB.value;
        this.selectedLink.ipA = ipA.value;
        this.selectedLink.ipB = ipB.value;

        this.hideLinkModal();
        this.draw();
    }

    hideDeviceModal() {
        document.getElementById('device-modal').classList.add('hidden');
    }

    hideLinkModal() {
        document.getElementById('link-modal').classList.add('hidden');
    }

    hideAllModals() {
        this.hideDeviceModal();
        this.hideLinkModal();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the entire topology?')) {
            this.devices = [];
            this.links = [];
            this.selectedDevice = null;
            this.selectedLink = null;
            this.deviceCounter = 0;
            this.linkCounter = 0;
            this.updateSummary();
            this.draw();
        }
    }

    exportTopology() {
        const topology = {
            name: 'generated-topology',
            mgmt: {
                network: 'internalnet',
                'ipv4-subnet': '192.168.101.0/24'
            },
            topology: {
                kinds: {
                    ceos: {
                        image: 'ceos:4.34.1F'
                    }
                },
                nodes: {},
                links: []
            }
        };

        // Add nodes
        this.devices.forEach(device => {
            topology.topology.nodes[device.name] = {
                kind: device.type,
                'mgmt-ipv4': device.config.mgmtIp,
                'startup-config': `configs/${device.name}.cfg`
            };
        });

        // Add links
        this.links.forEach(link => {
            topology.topology.links.push({
                endpoints: [`${link.deviceA.name}:${link.interfaceA}`, `${link.deviceB.name}:${link.interfaceB}`]
            });
        });

        this.downloadFile('topology.yml', YAML.stringify(topology));
    }

    exportConfigs() {
        // Export device configurations
        this.devices.forEach(device => {
            if (device.type === 'ceos') {
                const config = this.generateDeviceConfig(device);
                this.downloadFile(`${device.name}.cfg`, config);
            }
        });

        // Export Ansible inventory
        const inventory = this.generateAnsibleInventory();
        this.downloadFile('inventory.yml', inventory);
    }

    generateDeviceConfig(device) {
        return `! Device: ${device.name}
! Generated by Network Topology Builder

hostname ${device.config.hostname}
ip name-server vrf MGMT 8.8.8.8
ip name-server vrf MGMT 192.168.2.1

interface Management0
   vrf MGMT
   ip address ${device.config.mgmtIp}/24

interface Loopback0
   ip address ${device.config.loopbackIp}/32

! Add your specific interface configurations here
${this.generateInterfaceConfigs(device)}

router bgp ${device.config.asn}
   router-id ${device.config.loopbackIp}

end
`;
    }

    generateInterfaceConfigs(device) {
        const deviceLinks = this.links.filter(link =>
            link.deviceA === device || link.deviceB === device
        );

        return deviceLinks.map(link => {
            const isDeviceA = link.deviceA === device;
            const interface = isDeviceA ? link.interfaceA : link.interfaceB;
            const ip = isDeviceA ? link.ipA : link.ipB;
            const remoteDevice = isDeviceA ? link.deviceB : link.deviceA;

            let config = `interface ${interface}
   description to ${remoteDevice.name}`;
            if (ip) {
                config += `\n   ip address ${ip}`;
            }
            config += '\n   no shutdown\n';
            return config;
        }).join('\n');
    }

    generateAnsibleInventory() {
        const inventory = {
            all: {
                children: {
                    network_devices: {
                        vars: {
                            ansible_connection: 'network_cli',
                            ansible_network_os: 'eos'
                        },
                        hosts: {}
                    }
                }
            }
        };

        this.devices.forEach(device => {
            if (device.type === 'ceos') {
                inventory.all.children.network_devices.hosts[device.name] = {
                    ansible_host: device.config.mgmtIp
                };
            }
        });

        return YAML.stringify(inventory);
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    updateSummary() {
        document.getElementById('device-count').textContent = this.devices.length;
        document.getElementById('link-count').textContent = this.links.length;
    }

    updateDebugInfo(message) {
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            debugElement.textContent = message;
        }
    }
}

// YAML helper (simple implementation)
const YAML = {
    stringify: function(obj, indent = 0) {
        let result = '';
        const spaces = ' '.repeat(indent);

        if (Array.isArray(obj)) {
            obj.forEach(item => {
                result += spaces + '- ' + this.stringify(item, indent + 2).trim() + '\n';
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (typeof value === 'object') {
                    result += spaces + key + ':\n' + this.stringify(value, indent + 2);
                } else {
                    result += spaces + key + ': ' + value + '\n';
                }
            });
        } else {
            result += spaces + obj + '\n';
        }

        return result;
    }
};

// Global functions for HTML event handlers
let topologyBuilderInstance = null;

function handleDragStart(event) {
    const deviceType = event.target.closest('.device-item').dataset.type;
    event.dataTransfer.setData('text/plain', deviceType);
    event.dataTransfer.effectAllowed = 'copy';
    console.log('HTML dragstart fired for device type:', deviceType);

    if (topologyBuilderInstance) {
        topologyBuilderInstance.updateDebugInfo(`Dragging ${deviceType} device (HTML handler)`);
    }
}

function testDrag() {
    console.log('=== TEST DRAG BUTTON CLICKED ===');
    console.log('topologyBuilderInstance exists:', !!topologyBuilderInstance);

    if (!topologyBuilderInstance) {
        console.error('topologyBuilderInstance is null!');
        updateDebugInfoDirectly('ERROR: JavaScript not initialized');
        return;
    }

    console.log('topologyBuilderInstance type:', typeof topologyBuilderInstance);
    console.log('topologyBuilderInstance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(topologyBuilderInstance)));

    topologyBuilderInstance.updateDebugInfo('Test drag initiated');

    // Simulate adding a device programmatically
    const testDevice = {
        type: 'ceos',
        x: 100,
        y: 100
    };

    try {
        const device = topologyBuilderInstance.addDevice(testDevice.type, testDevice.x, testDevice.y);
        console.log('Test device added successfully:', device);
    } catch (error) {
        console.error('Error adding test device:', error);
        updateDebugInfoDirectly('ERROR: ' + error.message);
    }
}

function checkJS() {
    console.log('=== JAVASCRIPT CHECK ===');
    console.log('Window object:', typeof window);
    console.log('Document object:', typeof document);
    console.log('Console object:', typeof console);

    const debugElement = document.getElementById('debug-info');
    console.log('Debug element found:', !!debugElement);

    const canvas = document.getElementById('topology-canvas');
    console.log('Canvas element found:', !!canvas);

    console.log('topologyBuilderInstance exists:', !!topologyBuilderInstance);

    if (topologyBuilderInstance) {
        console.log('Instance properties:', Object.keys(topologyBuilderInstance));
        updateDebugInfoDirectly('JavaScript loaded successfully');
    } else {
        console.error('topologyBuilderInstance is null');
        updateDebugInfoDirectly('ERROR: Instance not created');
    }

    // Test basic DOM manipulation
    try {
        const testDiv = document.createElement('div');
        testDiv.textContent = 'DOM test successful';
        console.log('DOM manipulation works');
    } catch (error) {
        console.error('DOM manipulation failed:', error);
    }
}

function updateDebugInfoDirectly(message) {
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
        debugElement.textContent = message;
    } else {
        console.error('Debug element not found');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    topologyBuilderInstance = new TopologyBuilder();
});
