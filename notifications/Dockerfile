# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: migarci2- <migarci2@student.42.fr>         +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/08/29 16:03:17 by migarci2          #+#    #+#              #
#    Updated: 2024/11/09 12:46:04 by migarci2         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM python:3.11-bookworm

RUN apt-get update && apt-get install -y postgresql postgresql-contrib sudo

COPY service /service

RUN pip install --no-cache-dir -r /service/requirements.txt

EXPOSE 5053

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/bin/bash", "/entrypoint.sh"]