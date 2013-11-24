#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include <QTableView>
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
    void createTableView(QWidget *parentWidget, QMap<QString, QTableView*> *propMap) const;
    void syncViewToWidget(const NJson &view, QTableView *viewTable, QTableView *extraTable);
    void syncViewToWidget(const NJson &view, QTableView *Table);
    QList<NJson> getJsonList() const;
};

#endif // VIEW_PLUGIN_H
