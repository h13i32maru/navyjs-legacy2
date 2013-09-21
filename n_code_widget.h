#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include "n_file_tab_editor.h"
#include <QDir>
#include <QFileSystemModel>
#include <QFileSystemWatcher>
#include <QModelIndex>
#include <QWidget>

namespace Ui {
class NCodeWidget;
}

class NCodeWidget : public NFileTabEditor
{
    Q_OBJECT

public:
    explicit NCodeWidget(QWidget *parent = 0);
//    void saveAllFile();
//    bool saveFile(int tabIndex);
    ~NCodeWidget();

private:
    Ui::NCodeWidget *ui;

protected:
    virtual QWidget* createTabWidget(const QString &filePath);
    virtual QString editedFileContent(QWidget *widget);

//    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);
//    bool isFileContentChanged(int tabIndex);

private slots:
//    virtual void contextMenu(QPoint point);
//    void closeFile(int tabIndex);
//    void newFile();
//    void newDir();
//    void deletePath();
//    void renamePath();
//    void copyPath();
//    void updateTabForPathChanged(const QString &oldPath, const QString &newPath);
//    void updateTabForDropped(QString dropDirPath, QString selectedFilePath);
//    void updateTabForTextChanged();
//    void updateTabForPathDeleted(const QString &path, const bool &isDir);
};

#endif // N_CODE_WIDGET_H
