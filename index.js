const config = require('./config.json')
const express = require('express')
const fs = require('fs').promises
const app = express()
let template = ''

app.get('/', async(req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/get/:b64', async(req, res) => {
    processData(Buffer.from(req.params.b64, 'base64').toString('utf8'), res)
})

app.get('/editor', async(req, res) => {
    res.sendFile(__dirname + '/editor.html')
})

app.use(express.static('libs'))

async function processData(data, res) {
    if (template == '') template = await fs.readFile('template.html', 'utf8')

    const lines = data.split(config.lineSeperator)

    let objects = []

    for (const line of lines) {
        if (line.startsWith('# ')) { // Header
            objects.push({
                type: 'header',
                data: line.replace('# ', '')
            })
            continue
        }

        if (line.trim().length != 0) { // Trip
            const values = line.split('; ')
            if (values.length < 5) {
                continue
            }

            objects.push({
                type: 'trip',
                data: {
                    line: values[0],
                    from: [values[1], values[2]],
                    to: [values[3], values[4]]
                }
            })
        }
    }

    // Generate Page
    let html = template
    let htmlData = ''

    objects.forEach(obj => {
        if (obj.type == 'header') htmlData += `<h2>${obj.data}</h2>`
        if (obj.type == 'trip') {
            htmlData += `<div><p><span class='badge' style='background-color: ${config.colorScheme[obj.data.line] || '#6c757d'}; color: ${config.invertedForeground.includes(obj.data.line) ? '#000000' : '#ffffff'};'>${obj.data.line}</span>
            ${obj.data.from[0]} (${obj.data.from[1]}) - ${obj.data.to[0]} (${obj.data.to[1]})</p>
            </div>`
        }
    })

    // Send Page
    res.send(html.replace('%DATA%', htmlData))

}

app.listen(config.port, () => console.log(`(>) http://localhost:${config.port}`))