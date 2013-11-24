#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include "util/n_json.h"

class ViewPlugin
{
public:
    static ViewPlugin* instance();

private:
    static ViewPlugin* mInstance;
    ViewPlugin();
    QList<NJson> mJsonList;

public:
    void load(const QString &pluginDirPath);
    QList<NJson> getJsonList() const;
};

#endif // VIEW_PLUGIN_H
