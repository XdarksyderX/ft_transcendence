FROM python

WORKDIR /mywebsite

# ADD ENV TO THE CONTAINER (NOT IS NECESARY BUT IS BEST)

COPY conf/requirements.txt /requirements.txt
COPY tools/utils.sh /utils.sh
RUN chmod +x /utils.sh

# RUN apt-get update

RUN pip install -r /requirements.txt

ENTRYPOINT [ "sh", "/utils.sh" ]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
