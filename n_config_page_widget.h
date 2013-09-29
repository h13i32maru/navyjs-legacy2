#ifndef N_CONFIG_PAGE_WIDGET_H
#define N_CONFIG_PAGE_WIDGET_H

#include "n_file_widget.h"
#include "n_json.h"

#include <QWidget>

namespace Ui {
class NConfigPageWidget;
}

class NConfigPageWidget : public NFileWidget
{
    Q_OBJECT

public:
    enum PAGE_COL {PAGE_COL_ID, PAGE_COL_CLASS, PAGE_COL_CLASS_FILE, PAGE_COL_LAYOUT, PAGE_COL_BGCOLOR};
    explicit NConfigPageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent = 0);
    virtual bool save();
    ~NConfigPageWidget();

private:
    Ui::NConfigPageWidget *ui;
    NJson mConfigPage;

private slots:
    void newPage();
    void removePage();
    void contextMenu(QPoint point);
    void syncJsonToWidget();
    void syncWidgetToJson();
    void showRawData();
};

#endif // N_CONFIG_PAGE_WIDGET_H
