/**
 * check if the port is valid
 * @param port the port to be checked
 * @returns true if the port is valid, otherwise return false
 */
function isNetPort(port: number): boolean {
  if (!Number.isInteger(port)) return false
  return port >= 0 && port <= 65535
}

/**
 * check if the port is well known port
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports
 * @param port the port to be checked
 * @returns true if the port is well known port, otherwise return false
 */
function isWellKnownPort(port: number): boolean {
  return isNetPort(port) && port <= 1023
}

/**
 * check if the port is registered port
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Registered_ports
 * @param port the port to be checked
 * @returns true if the port is registered port, otherwise return false
 */
function isRegisteredPort(port: number): boolean {
  return isNetPort(port) && port >= 1024 && port <= 49151
}

/**
 * check if the port is dynamic port
 * @see https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Dynamic,_private_or_ephemeral_ports
 * @param port the port to be checked
 * @returns true if the port is dynamic port, otherwise return false
 */
function isDynamicPort(port: number): boolean {
  return isNetPort(port) && port >= 49152 && port <= 65535
}

/**
 * check if the ip is IPv4 string
 * @param ip the ip to be checked, e.g. 192.168.1.1
 * @returns true if the ip is IPv4 string, otherwise return false
 */
function isIPv4Str(ip?: string): boolean {
  if (!ip) return false
  return /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)$/.test(ip)
}

/**
 * check if the bytes is IPv4 Uint8Array
 * @param bytes the bytes to be checked
 * @returns true if the bytes is IPv4 Uint8Array, otherwise return false
 */
function isIPv4Bytes(bytes?: Uint8Array): boolean {
  if (!bytes) return false
  return bytes.length === 4
}

/**
 * check if the domain is valid
 * @param domain
 * @returns
 */
function isDomain(domain?: string): boolean {
  if (!domain) return false
  return /^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}$/.test(domain)
}

/**
 * convert the ip address to Uint8Array,use 4 bytes to represent the ip address
 * @param value
 * @returns
 */
function bytes2IPv4Str(value?: Uint8Array): string | undefined {
  if (!value || !isIPv4Bytes(value)) return undefined
  return Array.from(value).join('.')
}

/**
 * convert the ip address to Uint8Array,use 4 bytes to represent the ip address,this is only for IPv4
 * @param value
 * @returns
 */
function ipv4Str2Bytes(value?: string): Uint8Array | undefined {
  if (!value || !isIPv4Str(value)) return undefined
  return Uint8Array.from(value.split('.').map((v) => parseInt(v)))
}

/**
 * get the mac address using Deno.networkInterfaces()
 * @returns sorted, deduplicated list of MAC addresses, or undefined if none found
 */
function getMacAddr(): string[] | undefined {
  const macAddrs = Deno.networkInterfaces()
    .map((iface) => iface.mac.toLowerCase().replace(/-/g, ':'))
    .filter((mac) => mac !== '00:00:00:00:00:00')
    .filter((mac, index, array) => array.indexOf(mac) === index)
    .sort()

  return macAddrs.length > 0 ? macAddrs : undefined
}

const NetUtil = {
  isNetPort,
  isWellKnownPort,
  isRegisteredPort,
  isDynamicPort,
  isIPv4Str,
  isIPv4Bytes,
  isDomain,
  bytes2IPv4Str,
  ipv4Str2Bytes,
  getMacAddr
}

export { NetUtil }
