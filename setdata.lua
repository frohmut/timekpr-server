
<?lua

--[[
Write as JSON-String (without validation) to a local file.
Supposed to be using with the webserver (ctlmgr) on the fritzbox router.
--]]

path = string.gsub(box.glob.docroot .. box.glob.script, "/[^/]*$", "") 

-- write the sent json to the filesystem
-- todo: if the homee network is larger than a view devices, add locks etc.
function write_and_send_file()
	local f, err = io.open(path .. "/timekpr-data.json", "w")
	if f == nil then
		box.out('{ "error": "Database not writable: ' .. err .. '"}')
		return
	end
	local res, err = f:write(box.post.json);
	if res == nil then
		box.out('{ "error": "Database update failed: ' .. err .. '"}')
		return
	end
	-- if everything worked: return json back
	box.header("Content-type: application/json\nExpires: -1\n\n")
	box.out(box.post.json)
end


write_and_send_file()

?>
