<?php
/*
  Read a JSON-String (without validation) from a local file.
 */

$data = file_get_contents('./timekpr-data.json');
header('Content-Type: application/json');
echo $data;
?>
