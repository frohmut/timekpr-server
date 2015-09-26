
<?lua

--[[
Read a JSON-String (without validation) from a local file.
Supposed to be using with the webserver (ctlmgr) on the fritzbox router.
--]]

path = string.gsub(box.glob.docroot .. box.glob.script, "/[^/]*$", "") 

-- just read the json file and send it
-- todo: if the home network is bigger than a view devices, add locks etc.
function read_and_send_file()
	box.header("Content-type: application/json\nExpires: -1\n\n")
	local f, err = io.open(path .. "/timekpr-data.json", "r")
	if f == nil then
		box.out('{ "error": "Database not found: ' .. err .. '"}')
		return
	end
	local fcont = nil
	fcont = f:read("*all")
	f:close()
	if fcont == nil then
		box.out('{ "error": "Database not readable." }')
		return
	end

	box.out(fcont)
end

read_and_send_file()

?>
