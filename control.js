const net = require('net');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración del GPS
const DEVICE_IP = '3.23.99.134'; // Cambia por la IP del servidor en la nube
const DEVICE_PORT = 4000; // Cambia al puerto del servidor en la nube

// Función para calcular el checksum
function calculateChecksum(data) {
    return data.reduce((sum, byte) => sum + byte, 0) & 0xFF;
}

// Función para enviar comando DYD#
function sendDYDCommand(callback) {
    const command = Buffer.from('DYD#', 'ascii');
    const header = Buffer.from([0x78, 0x78]);
    const protocol = Buffer.from([0x80]);
    const length = Buffer.from([command.length + 5]);
    const serial = Buffer.from([0x00, 0x01]);
    const checksum = calculateChecksum([...protocol, ...command, ...serial]);
    const footer = Buffer.from([0x0D, 0x0A]);

    const packet = Buffer.concat([
        header,
        length,
        protocol,
        command,
        serial,
        Buffer.from([checksum]),
        footer,
    ]);

    const client = new net.Socket();
    client.connect(DEVICE_PORT, DEVICE_IP, () => {
        console.log('Conectado al servidor en la nube. Enviando comando DYD#...');
        client.write(packet);
    });

    client.on('data', (data) => {
        console.log('Respuesta del servidor:', data.toString('hex'));
        callback(null, data.toString('hex'));
        client.destroy();
    });

    client.on('close', () => {
        console.log('Conexión cerrada.');
    });

    client.on('error', (err) => {
        console.error('Error:', err.message);
        callback(err, null);
    });
}

// Función para enviar comando HFYD#
function sendHFYDCommand(callback) {
    const command = Buffer.from('HFYD#', 'ascii');
    const header = Buffer.from([0x78, 0x78]);
    const protocol = Buffer.from([0x80]);
    const length = Buffer.from([command.length + 5]);
    const serial = Buffer.from([0x00, 0x01]);
    const checksum = calculateChecksum([...protocol, ...command, ...serial]);
    const footer = Buffer.from([0x0D, 0x0A]);

    const packet = Buffer.concat([
        header,
        length,
        protocol,
        command,
        serial,
        Buffer.from([checksum]),
        footer,
    ]);

    const client = new net.Socket();
    client.connect(DEVICE_PORT, DEVICE_IP, () => {
        console.log('Conectado al servidor en la nube. Enviando comando HFYD#...');
        client.write(packet);
    });

    client.on('data', (data) => {
        console.log('Respuesta del servidor:', data.toString('hex'));
        callback(null, data.toString('hex'));
        client.destroy();
    });

    client.on('close', () => {
        console.log('Conexión cerrada.');
    });

    client.on('error', (err) => {
        console.error('Error:', err.message);
        callback(err, null);
    });
}

// Configuración de Express y Socket.IO
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('send-command', () => {
        sendDYDCommand((err, response) => {
            if (err) {
                socket.emit('response', `Error: ${err.message}`);
            } else {
                socket.emit('response', `Respuesta del servidor: ${response}`);
            }
        });
    });

    socket.on('send-hfyd-command', () => {
        sendHFYDCommand((err, response) => {
            if (err) {
                socket.emit('response', `Error: ${err.message}`);
            } else {
                socket.emit('response', `Respuesta del servidor: ${response}`);
            }
        });
    });
});

// Servidor escuchando
server.listen(4000, () => {
    console.log('Servidor web en http://localhost:3000');
});