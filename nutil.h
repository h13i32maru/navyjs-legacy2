#ifndef NUTIL_H
#define NUTIL_H

#include <QStringList>

class NUtil
{
public:
    NUtil();
    static void expand(QStringList &list, int size);
};

#endif // NUTIL_H
