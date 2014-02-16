#ifndef VIEW_PLUGIN_H
#define VIEW_PLUGIN_H

#include <QList>
#include <QMap>
#include <QHash>
#include <QTableWidget>
#include "util/n_json.h"

class ViewPlugin : public QObject
{
    Q_OBJECT

public:
    explicit ViewPlugin(QObject *parent = 0);

public:
    static QWidget* createWidget(const NJson &widgetDefine, QObject *receiver = NULL, const char* slot = NULL, QWidget *originWidget = NULL);
    static QWidget* createWidget(const NJson &widgetDefine, NJson &viewJson, QObject *receiver = NULL, const char* slot = NULL, QWidget *originWidget = NULL);
    static void syncWidgetToView(QWidget *widget, NJson &view, const QString &keyPrefix = QString(""));
    static void syncViewToWidget(const NJson &view, QWidget *widget, const QString &keyPrefix = QString(""));
    static QString widgetToString(QWidget *widget);
    static QWidget* copyWidget(QWidget *widget, QObject *receiver = NULL, const char *slot = NULL);

private:
    QTableWidget *mTableWidget;
    QList<NJson> mJsonList;
    QTableWidgetItem *mCurrentTableWidgetItem;
    QHash<QTableWidgetItem *, QWidget *> mItemToWidget;
    QObject *mReceiver;
    const char *mSlot;
    QHash<QString, QList<QTableWidgetItem*> > mClassToItems;

public:
    void load(const QString &pluginDirPath);
    void createTableView(QTableWidget *tableWidget, QMap<QString, NJson> *defaultMap, QObject *receiver, const char *slot);
    void syncViewToWidget(const NJson &view, const QString &className) const;
    void syncWidgetToView(NJson &view, const QString &className) const;
    void showTable(const QString &className);
    void hideTable(const QString &className);
    void hideAllTable();
    QStringList getClassNames() const;
    QList<NJson> getJsonList() const;
    void setNumberToSpinBox(const QString &objectName, int value);

private slots:
    void showCellWidget(QTableWidgetItem *item);
    void hideCellWidget(QTableWidgetItem *item);
    void hideCurrentCellWidget();
};

#endif // VIEW_PLUGIN_H
