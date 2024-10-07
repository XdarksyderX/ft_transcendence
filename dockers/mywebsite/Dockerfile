FROM python:3.12-bookworm

RUN apt update && apt install -y postgresql postgresql-contrib

WORKDIR /mywebsite

# ADD ENV TO THE CONTAINER (NOT IS NECESARY BUT IS BEST)

COPY conf /conf
COPY tools/utils.sh /utils.sh
RUN chmod +x /utils.sh

# RUN apt-get update

RUN pip install -r /conf/requirements.txt

ENTRYPOINT [ "sh", "/utils.sh" ]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
