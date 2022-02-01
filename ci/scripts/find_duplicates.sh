# this script finds duplicated files in project per provided extension

# $1 should contain file extension such as .png

result=$(find ./packages/ -name *$1 ! -path "**/node_modules/*" ! -empty -type f -exec md5sum {} + | sort | uniq -w32 -dD)


if [ -z "$result" ]
then
      echo "no duplicates for ${1}"
else
      echo "duplicates found"
      echo $result
      exit 1
fi
